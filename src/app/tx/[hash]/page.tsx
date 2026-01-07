import { Header } from "@/components/header"
import { Starfield } from "@/components/starfield"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/ui/copy-button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, getTransactionStatusColor,  } from "@/lib/utils"
import { transactionAPI } from "@/lib/api"
import { notFound } from "next/navigation"
import { DetailedTransaction, BufferData } from "@/lib/transaction-types"

interface PageProps {
  params: Promise<{ hash: string }>
}

export const dynamic = "force-dynamic"

function hashToString(hash: string | BufferData): string {
  if (typeof hash === 'string') {
    return hash
  }
  if (hash.type === 'Buffer' && Array.isArray(hash.data)) {
    return '0x' + Buffer.from(hash.data).toString('hex')
  }
  return ''
}



function parseHexValue(hexValue: string, decimals: number = 0): string {
  try {
    if (!hexValue || hexValue === '0x') return '0'
    const decimal = BigInt(hexValue).toString()
    const num = BigInt(decimal)
    if (decimals > 0) {
      const divisor = BigInt(10 ** decimals)
      const integerPart = num / divisor
      const decimalPart = num % divisor
      if (decimalPart === BigInt(0)) {
        return integerPart.toString()
      }
      return (Number(integerPart) + Number(decimalPart) / Math.pow(10, decimals)).toFixed(decimals)
    }
    return num.toString()
  } catch {
    return hexValue
  }
}

export default async function TransactionPage({ params }: PageProps) {
  const resolvedParams = await params
  
  let transaction: DetailedTransaction
  try {
    transaction = await transactionAPI.getTransaction<DetailedTransaction>(resolvedParams.hash)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    notFound()
  }
  
  console.log('Fetched transaction:', transaction)

  const getVariantBadge = (variant?: string) => {
    switch (variant) {
      case "Regular":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Regular
          </Badge>
        )
      case "System":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            System
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 z-0">
        <Starfield />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-2 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Transaction Details
                </h1>
                <p className="text-muted-foreground text-lg">View detailed information about this transaction</p>
              </div>
              <Link
                href="/transactions"
                className="px-4 py-2 bg-card/50 hover:bg-card/70 border border-border text-foreground rounded-md transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>

            {/* Transaction Hash Card */}
            <Card className="p-6 bg-card/50 border-border">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
                    <p className="text-lg font-mono break-all text-blue-400">{hashToString(transaction.hash)}</p>
                  </div>
                  <CopyButton text={hashToString(transaction.hash)} className="border-border" />
                </div>

                <div className="flex items-center gap-2">
                  {getVariantBadge(transaction.variant)}
                </div>
              </div>
            </Card>

            {/* Transaction Details */}
            <Card className="p-6 bg-card/50 border-border">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Overview</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Block</p>
                    {transaction.blockId ? (
                      <Link
                        href={`/block/${transaction.blockId}`}
                        className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-lg"
                      >
                        #{transaction.blockId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-lg">Pending</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Timestamp</p>
                    {transaction.timestamp ? (
                      <div className="space-y-1">
                        <p className="text-sm">{new Date(Number(transaction.timestamp)).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(Number(transaction.timestamp)))} ago)
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Protocol Version</p>
                    <p className="text-lg font-mono">v{transaction.protocolVersion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Size</p>
                    <p className="text-lg font-mono">{transaction.size ? `${transaction.size} bytes` : "N/A"}</p>
                  </div>
                </div>

                {transaction.regularTransaction && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Start Index</p>
                      <p className="text-lg font-mono">{transaction.regularTransaction.startIndex}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Transaction Result</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getTransactionStatusColor(transaction.regularTransaction.transactionResult).bg} ${getTransactionStatusColor(transaction.regularTransaction.transactionResult).text} border ${getTransactionStatusColor(transaction.regularTransaction.transactionResult).border}`}>
                          {transaction.regularTransaction.transactionResult}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Overview + Raw Transaction Data Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Raw Transaction Data */}
              {transaction.raw && (
                <Card className="p-6 bg-card/50 border-border lg:order-2">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Raw Transaction Data</h2>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 bg-background/50 rounded-lg p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <p className="text-xs font-mono break-all text-muted-foreground leading-relaxed">
                          {transaction.raw}
                        </p>
                      </div>
                      <CopyButton text={transaction.raw} className="border-border flex-shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="block">Size: {transaction.raw.length} characters</span>
                      <span className="text-muted-foreground/70">({Math.ceil((transaction.raw.length - 2) / 2)} bytes)</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Overview - Moved here for side-by-side layout */}
              <div className="lg:order-1">
                <Card className="p-6 bg-card/50 border-border h-full">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Overview</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Block</p>
                        {transaction.blockId ? (
                          <Link
                            href={`/block/${transaction.blockId}`}
                            className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm"
                          >
                            #{transaction.blockId}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending</span>
                        )}
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Protocol V</p>
                        <p className="text-sm font-mono">v{transaction.protocolVersion}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg col-span-2">
                        <p className="text-xs text-muted-foreground mb-2">Timestamp</p>
                        {transaction.timestamp ? (
                          <div className="space-y-1">
                            <p className="text-xs">{new Date(Number(transaction.timestamp)).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              ({formatDistanceToNow(new Date(Number(transaction.timestamp)))} ago)
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Pending</span>
                        )}
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg col-span-2">
                        <p className="text-xs text-muted-foreground mb-2">Size</p>
                        <p className="text-sm font-mono">{transaction.size ? `${transaction.size} bytes` : "N/A"}</p>
                      </div>
                    </div>

                    {transaction.regularTransaction && (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Start Index</p>
                          <p className="text-sm font-mono">{transaction.regularTransaction.startIndex}</p>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Result</p>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            transaction.regularTransaction.transactionResult === 'Success' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.regularTransaction.transactionResult}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Merkle Tree Root and Transaction Fees - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {transaction.regularTransaction?.merkleTreeRoot && (
                <Card className="p-6 bg-card/50 border-border">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Merkle Tree Root</h2>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-mono break-all text-muted-foreground flex-1">
                      {transaction.regularTransaction.merkleTreeRoot}
                    </p>
                    <CopyButton text={transaction.regularTransaction.merkleTreeRoot} className="border-border flex-shrink-0" />
                  </div>
                </Card>
              )}

              {transaction.regularTransaction?.paidFees && (
                <Card className="p-6 bg-card/50 border-border">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Transaction Fees</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">Paid Fees</span>
                      <span className="font-mono text-foreground">{transaction.regularTransaction.paidFees}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">Estimated Fees</span>
                      <span className="font-mono text-foreground">{transaction.regularTransaction.estimatedFees}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Ledger Events and Unshielded UTXOs - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ledger Events */}
              {transaction.ledgerEvents && (
                <Card className="p-6 bg-card/50 border-border">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Ledger Events</h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Variant</p>
                      <p className="font-mono text-foreground text-sm">{transaction.ledgerEvents.variant}</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Grouping</p>
                      <p className="font-mono text-foreground text-sm">{transaction.ledgerEvents.grouping}</p>
                    </div>

                    {transaction.ledgerEvents.raw && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Raw Event Data</p>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 bg-background/50 rounded-lg p-3 max-h-[120px] overflow-y-auto">
                            <p className="text-xs font-mono break-all text-muted-foreground leading-relaxed">
                              {transaction.ledgerEvents.raw}
                            </p>
                          </div>
                          <CopyButton text={transaction.ledgerEvents.raw} className="border-border flex-shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Unshielded UTXOs */}
              {transaction.unshieldedUtxos && (
                <Card className="p-6 bg-card/50 border-border">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Unshielded UTXOs</h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Owner</p>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-mono break-all text-blue-400 flex-1">
                          {transaction.unshieldedUtxos.owner}
                        </p>
                        <CopyButton text={transaction.unshieldedUtxos.owner} className="border-border flex-shrink-0" />
                      </div>
                    </div>

                    {transaction.unshieldedUtxos.tokenType && (
                      <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Token Type</p>
                        <p className="text-xs font-mono text-purple-400 mb-1">
                          {transaction.unshieldedUtxos.tokenType === '0x0000000000000000000000000000000000000000000000000000000000000000'
                            ? 'Native (Midnight)'
                            : transaction.unshieldedUtxos.tokenType}
                        </p>
                      </div>
                    )}

                    {transaction.unshieldedUtxos.value && (
                      <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Value</p>
                        <p className="text-sm font-semibold text-green-400">
                          {parseHexValue(transaction.unshieldedUtxos.value, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono break-all mt-1">
                          {transaction.unshieldedUtxos.value}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Dust Generation</p>
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                        transaction.unshieldedUtxos.registeredForDustGeneration
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-muted/50 text-muted-foreground border border-border'
                      }`}>
                        {transaction.unshieldedUtxos.registeredForDustGeneration ? '✓ Registered' : 'Not Registered'}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Ledger Events Attributes */}
            {transaction.ledgerEvents?.attributes?.DustInitialUtxo && (
              <Card className="p-6 bg-card/50 border-border">
                <h2 className="text-xl font-semibold mb-4 text-purple-400">Dust Initial UTXO Details</h2>
                <div className="space-y-6">
                  {/* Output Section */}
                  {transaction.ledgerEvents.attributes.DustInitialUtxo.output && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">Output</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Sequence</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.output.seq}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Creation Time</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.output.ctime}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">MT Index</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.output.mt_index}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Initial Value</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.output.initial_value}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Nonce</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.output.nonce}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.output.nonce} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Owner</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.output.owner}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.output.owner} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Backing Night</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.output.backing_night}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.output.backing_night} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generation Info Section */}
                  {transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info && (
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400 mb-3">Generation Info</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Creation Time</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.ctime}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Deletion Time</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.dtime}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Value</p>
                            <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.value}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Nonce</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.nonce}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.nonce} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Owner</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.owner}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.owner} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Night UTXO Hash</p>
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-mono break-all text-foreground flex-1">
                              {transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.night_utxo_hash}
                            </p>
                            <CopyButton text={transaction.ledgerEvents.attributes.DustInitialUtxo.generation_info.night_utxo_hash} className="border-border flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generation Index */}
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Generation Index</p>
                    <p className="text-sm font-mono text-foreground">{transaction.ledgerEvents.attributes.DustInitialUtxo.generation_index}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Additional Info */}
            <Card className="p-6 bg-card/50 border-border">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Additional Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 uppercase">Variant</p>
                  <div className="flex items-center gap-2">
                    {getVariantBadge(transaction.variant)}
                  </div>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 uppercase">Block ID</p>
                  <span className="font-mono text-sm">
                    {transaction.blockId ? `#${transaction.blockId}` : "Pending"}
                  </span>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 uppercase">Protocol V</p>
                  <span className="font-mono text-sm">v{transaction.protocolVersion}</span>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 uppercase">TX Size</p>
                  <span className="font-mono text-sm">{transaction.size ? `${transaction.size} B` : "N/A"}</span>
                </div>
                <div className="p-3 bg-background/50 rounded-lg col-span-2 md:col-span-2">
                  <p className="text-xs text-muted-foreground mb-2 uppercase">Transaction ID</p>
                  <span className="font-mono text-xs break-all">{transaction.id}</span>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}