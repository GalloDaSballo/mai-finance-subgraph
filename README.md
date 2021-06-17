# Mai Finance

Track Vaults, Accounts and Protocol Level Data

## Playground

[https://thegraph.com/explorer/subgraph/gallodasballo/mai-finance](https://thegraph.com/explorer/subgraph/gallodasballo/mai-finance)

## Entities
Vault ← Vault for deposit and borrow
Account ← Address that has vaults
Protocol ← Used to calculate total fees
Liquidation ← Event of being liquidated

## Examples

Find Vaults to Liquidate

```jsx
{
  vaults(first: 5, orderBy: collateralRatio, orderDirection:asc, where: {borrowed_gt: 0}) {
    id
    account {
      id
    }
    deposited
    borrowed
    collateralRatio
  }
}
```

This will return the vaults with the lowest collateralRatio, most likely to be liquidated

Given an address you can fetch their vaults

```jsx
{
  accounts(where: {id: "0x000000000057e8abd581828a2b40076852c0ba6e"}) {
    id
    vaults {
      id
      deposited
	    borrowed
    }
  }
}
```

You can also track vaults and their stats

```jsx
vaults(first: 5) {
    id
    account {
      id
    }
    deposited
    borrowed
  }
```

Get protocol lifetime closing fees, deposits and miMatic minted

```jsx
{
  protocols(first: 1) {
    id
		totalBorrowed
    totalDeposited
    totalClosingFees
	}
}
```


## Liquidations
Find liquidations by Account
```jsx
{
  liquidations(first: 5, where: {account: "0x123"}) {
    id
    loss
    debt
    vault {
      id
    }
    account {
      id
    }
	}
}

```

Find liquidations by Vault
```jsx
{
  liquidations(first: 5, where: {vault: 113}) {
    id
    loss
    debt
    vault {
      id
    }
    account {
      id
    }
	}
}

```

## Historical Queries
Find vaults before block 1.4MLN
```jsx
{
  vaults(first: 5, block: {number:14000000}) {
    id
    account {
      id
    }
    deposited
    borrowed
  }
}
```

Protocol data at block 1.4MLN
```jsx
{
  protocols(first: 5, block: {number:14000000}) {
    id
		totalBorrowed
    totalDeposited
    totalClosingFees
	}
} 
```

Liquidations query with timestamp
```jsx
{
  liquidations(first: 5, where: {account: "0x123", timestamp_gt: 123123123}, ) {
    id
    loss
    debt
    vault {
      id
    }
    account {
      id
    }
	}
}
```

## Notes:

Destroying a vault sends it to address zero, I don't believe there's a command to destroy an entity on theGraph

## Changelog

Also tracks collateralRatio to help finding vaults that need to be liquidated

Also tracks liquidations
