import { BigInt } from '@graphprotocol/graph-ts';
import { QiStablecoin, CreateVault, DestroyVault, TransferVault, DepositCollateral, WithdrawCollateral, BorrowToken, PayBackToken, BuyRiskyVault } from '../generated/QiStablecoin/QiStablecoin'
import { loadAccount, loadProtocol, loadVault } from './utils'

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

  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = 0
  }
  
  vault.save()
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.deposited = vault.deposited.minus(event.params.amount)

  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = 0
  }

  vault.save()
}

export function handleBorrowToken(event: BorrowToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.borrowed = vault.borrowed.plus(event.params.amount)

  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = 0
  }

  vault.save()
}

export function handlePayBackToken(event: PayBackToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  const protocol = loadProtocol()
  protocol.totalClosingFees = protocol.totalClosingFees.plus(event.params.closingFee)
  protocol.save()

  vault.closingFees = vault.closingFees.plus(event.params.closingFee)

  vault.borrowed = vault.borrowed.minus(event.params.amount)
  
  vault.deposited = vault.deposited.minus(event.params.closingFee)

  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = 0
  }

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

  // Pass ownership
  vault.account = event.params.buyer.toHexString()
  vault.deposited = vault.deposited.minus(closingFee) // Fees are subtracted here


  // Add closing Fees to protocol
  const protocol = loadProtocol()
  protocol.totalClosingFees = protocol.totalClosingFees.plus(paidFee)
  protocol.save()

  // Recalculate collateralization ratio
  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = 0
  }
  vault.save()
}
