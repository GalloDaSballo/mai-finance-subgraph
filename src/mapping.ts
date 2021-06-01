import { BigInt } from '@graphprotocol/graph-ts';
import { CreateVault, DestroyVault, TransferVault, DepositCollateral, WithdrawCollateral, BorrowToken, PayBackToken, BuyRiskyVault } from '../generated/QiStablecoin/QiStablecoin'
import { loadAccount, loadVault } from './utils'

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
  vault.save()

}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.deposited = vault.deposited.minus(event.params.amount)
  vault.save()
}

export function handleBorrowToken(event: BorrowToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.borrowed = vault.borrowed.plus(event.params.amount)
  vault.save()
}

export function handlePayBackToken(event: PayBackToken): void {
  const vaultId = event.params.vaultID.toString()
  const vault = loadVault(vaultId)

  vault.closingFees = vault.closingFees.plus(event.params.closingFee)
  vault.borrowed = vault.borrowed.minus(event.params.amount)
  vault.save()
}

export function handleBuyRiskyVault(event: BuyRiskyVault): void {

}