import { BigInt } from '@graphprotocol/graph-ts';
import { Vault } from '../generated/schema'

export const loadVault = (vaultId: string): Vault => {
  let vault = Vault.load(vaultId)
  if(!vault){
    vault = new Vault(vaultId)
    vault.deposited = BigInt.fromI32(0)
    vault.borrowed = BigInt.fromI32(0)
  }

  return vault as Vault
}