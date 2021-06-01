# Mai Finance

Track Vaults, Accounts and Protocol Level Data

## Playground

[https://thegraph.com/explorer/subgraph/gallodasballo/mai-finance](https://thegraph.com/explorer/subgraph/gallodasballo/mai-finance)

## Entities
Vault ← Vault for deposit and borrow

Account ← Address that has vaults

Protocol ← Used to calculate total fees

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

Get protocol lifetime closing fees

```jsx
{
  protocols(first: 1) {
    id
    totalClosingFees
  }
}
```

## Notes:

Destroying a vault sends it to address zero, I don't believe there's a command to destroy an entity on theGraph

## Changelog

Also tracks collateralRatio to help finding vaults that need to be liquidated

Also tracks liquidations
