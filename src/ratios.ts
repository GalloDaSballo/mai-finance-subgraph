import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Protocol, Vault } from "../generated/schema";

export const calculateVaultCollateRatio = (vault: Vault): void => {
  if(vault.borrowed.gt(BigInt.fromI32(0))){
    vault.collateralRatio = vault.deposited.toBigDecimal().div(vault.borrowed.toBigDecimal())
  } else {
    vault.collateralRatio = BigDecimal.fromString("0")
  }
} 

export const calculateProtocolCollateralRatio = (protocol: Protocol): void => {
  if(protocol.totalBorrowed.gt(BigInt.fromI32(0))){
    protocol.averageCollateralRatio = protocol.totalDeposited.toBigDecimal().div(protocol.totalBorrowed.toBigDecimal())
  } else {
    protocol.averageCollateralRatio = BigDecimal.fromString("0")
  }
}