import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { QiStablecoin, CreateVault, DestroyVault, TransferVault, DepositCollateral, WithdrawCollateral, BorrowToken, PayBackToken, BuyRiskyVault } from '../generated/QiStablecoin/QiStablecoin'
import { calculateProtocolCollateralRatio, calculateVaultCollateRatio } from './ratios';
import { loadAccount, loadLiquidation, loadProtocol, loadVault } from './utils'

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function handleCreateVault(event: CreateVault): void {
  // Load or create account
  const accountId = event.params.creator.toHexString()
  const account = loadAccount(accountId)
  account.save()
  
  // Add Account to vault
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.account = accountId;

  // Save
  vault.save()
}

export function handleDestroyVault(event: DestroyVault): void {
  const account = loadAccount(ZERO_ADDRESS)

  // Send Vault to Account 0 and reset values
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.account = account.id // Since we can't destroy, let's assign to zero address
  vault.deposited = BigInt.fromI32(0)
  vault.borrowed = BigInt.fromI32(0)

  // Notice, cannot destroy if borrwed > 0

  // Notice: Deposited coulbe more than 0, so you need to reduce from protocol

  // Save
  account.save() 
  vault.save()
}

export function handleTransferVault(event: TransferVault): void {
  // Create or load account
  const accountId = event.params.to.toHexString()
  const account = loadAccount(accountId)

  // Transfer Vault to Account
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.account = accountId

  // Save
  account.save()
  vault.save()
}

export function handleDepositCollateral(event: DepositCollateral): void {
  // Increase Vault Deposits
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.deposited = vault.deposited.plus(event.params.amount)

  // Increase Protocol Deposits
  const protocol = loadProtocol()
  protocol.totalDeposited = protocol.totalDeposited.plus(event.params.amount)

  // Recalculate Collaterals
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  // Save
  protocol.save()
  vault.save()
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  // Reduce Vault Deposits
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.deposited = vault.deposited.minus(event.params.amount)

  // Reduce Protocol Deposits
  const protocol = loadProtocol()
  protocol.totalDeposited = protocol.totalDeposited.minus(event.params.amount)

  // Recalculate Collaterals
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  // Save
  protocol.save()
  vault.save()
}

export function handleBorrowToken(event: BorrowToken): void {
  // Increase Vault Borrowed
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)
  vault.borrowed = vault.borrowed.plus(event.params.amount)
  
  // Increase Protocol Borrowed
  const protocol = loadProtocol()
  protocol.totalBorrowed = protocol.totalBorrowed.plus(event.params.amount)

  // Recalculate Collaterals
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  // Save
  protocol.save()
  vault.save()
}

export function handlePayBackToken(event: PayBackToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  // Reduce Borrowed and subtract closing fees from deposited for Vaults
  vault.borrowed = vault.borrowed.minus(event.params.amount)
  vault.deposited = vault.deposited.minus(event.params.closingFee)
  vault.closingFees = vault.closingFees.plus(event.params.closingFee)

  // Reduce Protocol Borrowed Borrowed and subtract closing fees from deposited
  const protocol = loadProtocol()
  protocol.totalBorrowed = protocol.totalBorrowed.minus(event.params.amount)
  protocol.totalDeposited = protocol.totalDeposited.minus(event.params.closingFee)
  protocol.totalClosingFees = protocol.totalClosingFees.plus(event.params.closingFee)

  // Recalculate Collaterals
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  // Save
  protocol.save()
  vault.save()
}

export function handleBuyRiskyVault(event: BuyRiskyVault): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  // Get contract state to calculate closing fee
  let contract = QiStablecoin.bind(event.address)

  // Contract Data
  const closingFee = contract.closingFee()
  const tokenPrice = contract.getTokenPriceSource()
  const ethPrice = contract.getEthPriceSource()
  const debtDifference = event.params.amountPaid
  const paidFee = (debtDifference.times(closingFee).times(tokenPrice)).div(ethPrice.times(BigInt.fromI32(10000)));

  // Liquidation data
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

  const oldBorrowed = vault.borrowed

  // Pass ownership
  vault.account = event.params.buyer.toHexString()
  vault.deposited = vault.deposited.minus(paidFee) // Fees are subtracted here
  vault.borrowed = contract.vaultDebt(event.params.vaultID);

  // Add closing Fees to protocol
  const protocol = loadProtocol()
  protocol.totalClosingFees = protocol.totalClosingFees.plus(paidFee)
  protocol.totalDeposited = protocol.totalDeposited.minus(paidFee) // Fees go from deposited

  // Update protocolBorrowed
  if (oldBorrowed.gt(vault.borrowed)) {
    // Vault has less debt
    protocol.totalBorrowed = protocol.totalBorrowed.minus(oldBorrowed.minus(vault.borrowed))
  }

  if(oldBorrowed.lt(vault.borrowed)){
    // I don't believe this ever happens
    protocol.totalBorrowed = protocol.totalBorrowed.plus(vault.borrowed.minus(oldBorrowed))
  }


  // Recalculate Collaterals
  calculateVaultCollateRatio(vault)
  calculateProtocolCollateralRatio(protocol)

  // Save
  protocol.save()
  vault.save()
}
