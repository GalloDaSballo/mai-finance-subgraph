import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Vault, Account, Protocol} from '../generated/schema'

const PROTOCOL_V1 = "V1";

export const loadProtocol = (): Protocol => {
  let protocol = Protocol.load(PROTOCOL_V1)
  if(!protocol){
    protocol = new Protocol(PROTOCOL_V1)
    protocol.totalClosingFees = BigInt.fromI32(0)
  }

  return protocol as Protocol
}


export const loadVault = (vaultId: string): Vault => {
  let vault = Vault.load(vaultId)
  if(!vault){
    vault = new Vault(vaultId)
    vault.deposited = BigInt.fromI32(0)
    vault.borrowed = BigInt.fromI32(0)
    vault.closingFees = BigInt.fromI32(0)
    vault.collateralRatio = BigDecimal.fromString("0")
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
