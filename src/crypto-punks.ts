import {
    Assign as AssignEvent,
    Transfer as TransferEvent,
    PunkTransfer as PunkTransferEvent,
    PunkOffered as PunkOfferedEvent,
    PunkBidEntered as PunkBidEnteredEvent,
    PunkBidWithdrawn as PunkBidWithdrawnEvent,
    PunkBought as PunkBoughtEvent,
    PunkNoLongerForSale as PunkNoLongerForSaleEvent
} from "../generated/CryptoPunks/CryptoPunks"
import {
    Assign,
    Transfer,
    PunkTransfer,
    PunkOffered,
    PunkBidEntered,
    PunkBidWithdrawn,
    PunkBought,
    PunkNoLongerForSale,
    PunkHistoryInfo,
    UserInfo
} from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts";

export function handleAssign(event: AssignEvent): void {
    let entity = new Assign(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.to = event.params.to
    entity.punkIndex = event.params.punkIndex

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handleTransfer(event: TransferEvent): void {
    let entity = new Transfer(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.from = event.params.from
    entity.to = event.params.to
    entity.value = event.params.value

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handlePunkTransfer(event: PunkTransferEvent): void {
    let entity = new PunkTransfer(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.from = event.params.from
    entity.to = event.params.to
    entity.punkIndex = event.params.punkIndex

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handlePunkOffered(event: PunkOfferedEvent): void {
    let entity = new PunkOffered(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.punkIndex = event.params.punkIndex
    entity.minValue = event.params.minValue
    entity.toAddress = event.params.toAddress

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handlePunkBidEntered(event: PunkBidEnteredEvent): void {
    let entity = new PunkBidEntered(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.punkIndex = event.params.punkIndex
    entity.value = event.params.value
    entity.fromAddress = event.params.fromAddress

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handlePunkBidWithdrawn(event: PunkBidWithdrawnEvent): void {
    let entity = new PunkBidWithdrawn(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.punkIndex = event.params.punkIndex
    entity.value = event.params.value
    entity.fromAddress = event.params.fromAddress

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handlePunkBought(event: PunkBoughtEvent): void {
    // 处理购买的事件信息
    let punkBoughtEntity = new PunkBought(event.transaction.hash.concatI32(event.logIndex.toI32()))
    punkBoughtEntity.punkIndex = event.params.punkIndex
    punkBoughtEntity.value = event.params.value
    punkBoughtEntity.fromAddress = event.params.fromAddress
    punkBoughtEntity.toAddress = event.params.toAddress
    punkBoughtEntity.blockNumber = event.block.number
    punkBoughtEntity.blockTimestamp = event.block.timestamp
    punkBoughtEntity.transactionHash = event.transaction.hash
    punkBoughtEntity.save()

    // 处理单Punk历史记录
    let historyEntity = new PunkHistoryInfo(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    historyEntity.punkIndex = event.params.punkIndex
    historyEntity.fromAddress = event.params.fromAddress
    historyEntity.toAddress = event.params.toAddress
    historyEntity.price = event.params.value
    historyEntity.timestamp = event.block.timestamp
    historyEntity.save()

    // 设置用户信息
    let fromUser = UserInfo.load(event.params.fromAddress)
    // 如果fromUser不存在，创建新的
    if (!fromUser) {
        fromUser = new UserInfo(event.params.fromAddress)
        fromUser.punkTransactionCount = BigInt.fromI32(0)
        fromUser.totalSpent = BigInt.fromI32(0)
    }

    let toUser = UserInfo.load(event.params.toAddress)
    // 如果toUser不存在，创建新的
    if (!toUser) {
        toUser = new UserInfo(event.params.toAddress)
        toUser.punkTransactionCount = BigInt.fromI32(0)
        toUser.totalReceived = BigInt.fromI32(0)
    }

    // 更新fromUser
    fromUser.punkTransactionCount = fromUser.punkTransactionCount.plus(BigInt.fromI32(1))
    fromUser.totalSpent = fromUser.totalSpent.plus(event.params.value)

    // 更新toUser
    toUser.punkTransactionCount = toUser.punkTransactionCount.plus(BigInt.fromI32(1))
    toUser.totalReceived = toUser.totalReceived.plus(event.params.value)

    fromUser.save()
    toUser.save()
}

export function handlePunkNoLongerForSale(
    event: PunkNoLongerForSaleEvent
): void {
    let entity = new PunkNoLongerForSale(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.punkIndex = event.params.punkIndex

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}
