import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { QiStablecoin, CreateVault, DestroyVault, TransferVault, DepositCollateral, WithdrawCollateral, BorrowToken, PayBackToken, BuyRiskyVault } from '../generated/QiStablecoin/QiStablecoin'
import { calculateProtocolCollateralRatio, calculateVaultCollateRatio } from './ratios';
import { loadAccount, loadLiquidation, loadProtocol, loadVault } from './utils'

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function handleCreateVault(event: CreateVault): void {
  const vaultId = event.params.vaultID.toString()
  const accountId = event.params.creator.toHexString()

  const account = loadAccount(accountId)
  account.save()

  const vault = loadVault(vaultId)
  vault.account = accountId;
  vault.save()
  
}

export function handleDestroyVault(event: DestroyVault): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  const account = loadAccount(ZERO_ADDRESS)
  account.save() // Just in case we need zero address

  vault.account = account.id // Since we can't destroy, let's assign to zero address
  vault.deposited = BigInt.fromI32(0)
  vault.borrowed = BigInt.fromI32(0)
  vault.save()
}

export function handleTransferVault(event: TransferVault): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  const accountId = event.params.to.toHexString()
  const account = loadAccount(accountId)
  account.save()

  vault.account = accountId
  vault.save()
}

export function handleDepositCollateral(event: DepositCollateral): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.deposited = vault.deposited.plus(event.params.amount)
  const protocol = loadProtocol()
  protocol.totalDeposited = protocol.totalDeposited.plus(event.params.amount)

  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  protocol.save()
  vault.save()
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.deposited = vault.deposited.minus(event.params.amount)

  const protocol = loadProtocol()
  protocol.totalDeposited = protocol.totalDeposited.minus(event.params.amount)


  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  protocol.save()
  vault.save()
}

export function handleBorrowToken(event: BorrowToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.borrowed = vault.borrowed.plus(event.params.amount)
  
  const protocol = loadProtocol()
  protocol.totalBorrowed = protocol.totalBorrowed.plus(event.params.amount)

  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  protocol.save()
  vault.save()
}

export function handlePayBackToken(event: PayBackToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  const protocol = loadProtocol()
  protocol.totalBorrowed = protocol.totalBorrowed.minus(event.params.amount)
  protocol.totalDeposited = protocol.totalDeposited.minus(event.params.closingFee)
  protocol.totalClosingFees = protocol.totalClosingFees.plus(event.params.closingFee)
  
  vault.borrowed = vault.borrowed.minus(event.params.amount)
  vault.deposited = vault.deposited.minus(event.params.closingFee)
  vault.closingFees = vault.closingFees.plus(event.params.closingFee)


  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  protocol.save()
  vault.save()
}

export function handleBuyRiskyVault(event: BuyRiskyVault): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)



  // Get contract state to calculate closing fee
  let contract = QiStablecoin.bind(event.address)

  const closingFee = contract.closingFee()
  const tokenPrice = contract.getTokenPriceSource()
  const ethPrice = contract.getEthPriceSource()
  const debtDifference = event.params.amountPaid
  const paidFee = (debtDifference.times(closingFee).times(tokenPrice)).div(ethPrice.times(BigInt.fromI32(10000)));

  // Liquidation
  const liquidationId = vault.id + "" + event.block.timestamp.toString()
  const liquidation = loadLiquidation(liquidationId)
  liquidation.timestamp = event.block.timestamp
  liquidation.loss = vault.deposited
  liquidation.debt = vault.borrowed
  liquidation.vault = vault.id
  liquidation.ethPriceAtTime = ethPrice
  liquidation.tokenPriceAtTime = tokenPrice
  liquidation.account = vault.account

  liquidation.save()


  // Pass ownership
  vault.account = event.params.buyer.toHexString()
  vault.deposited = vault.deposited.minus(paidFee) // Fees are subtracted here
  vault.borrowed = contract.vaultDebt(event.params.vaultID);



  // Add closing Fees to protocol
  const protocol = loadProtocol()
  protocol.totalClosingFees = protocol.totalClosingFees.plus(paidFee)
  protocol.totalDeposited = protocol.totalDeposited.minus(paidFee) // Fees go from deposited
  protocol.totalBorrowed = protocol.totalBorrowed.minus(debtDifference) // debtDifference is burned hence it reduces totalBorrowed


  // Recalculate collateralization ratio
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  protocol.save()
  vault.save()
}
