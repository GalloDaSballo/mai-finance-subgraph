import { CreateVault, DestroyVault, TransferVault, DepositCollateral, WithdrawCollateral, BorrowToken, PayBackToken, BuyRiskyVault } from '../generated/QiStablecoin/QiStablecoin'
import { loadVault } from './utils'

export function handleCreateVault(event: CreateVault): void {
  const vaultId = event.params.vaultID.toString()
  const accountId = event.params.creator.toHexString()

  const vault = loadVault(vaultId)

  vault.account = accountId;
  vault.save()
  
}

export function handleDestroyVault(event: DestroyVault): void {}

export function handleTransferVault(event: TransferVault): void {}

export function handleDepositCollateral(event: DepositCollateral): void {}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {}

export function handleBorrowToken(event: BorrowToken): void {}

export function handlePayBackToken(event: PayBackToken): void {}

export function handleBuyRiskyVault(event: BuyRiskyVault): void {}