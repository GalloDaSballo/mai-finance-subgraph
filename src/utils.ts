import { BigInt } from '@graphprotocol/graph-ts';
import { Vault, Account } from '../generated/schema'

export const loadVault = (vaultId: string): Vault => {
  let vault = Vault.load(vaultId)
  if(!vault){
    vault = new Vault(vaultId)
    vault.deposited = BigInt.fromI32(0)
    vault.borrowed = BigInt.fromI32(0)
    vault.closingFees = BigInt.fromI32(0)
  }

  return vault as Vault
}


export const loadAccount = (accountId: string): Account => {
  let account = Account.load(accountId)
  if(!account){
    account = new Account(accountId)
  }

  return account as Account
}
