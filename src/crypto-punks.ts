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
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

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

    // 处理用户信息
    let toUser = getUserInfo(event.params.to)
    toUser.punkHoldingCount = toUser.punkHoldingCount.plus((BigInt.fromI32(1)))

    toUser.save()
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

    // 处理用户信息
    let fromUser = getUserInfo(event.params.from)
    let toUser = getUserInfo(event.params.to)

    fromUser.punkHoldingCount = fromUser.punkHoldingCount.minus(BigInt.fromI32(1))
    toUser.punkHoldingCount = toUser.punkHoldingCount.plus((BigInt.fromI32(1)))

    fromUser.save()
    toUser.save()
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
    let punkHistoryEntity = PunkHistoryInfo.load(event.params.punkIndex.toString())
    if (punkHistoryEntity == null) {
        punkHistoryEntity = new PunkHistoryInfo(event.params.punkIndex.toString())
        // 在保存实体之前，确保设置了所有必填字段：
        punkHistoryEntity.totalTransactions = BigInt.fromI32(1)
        punkHistoryEntity.lastFromAddress = event.params.fromAddress
        punkHistoryEntity.lastToAddress = event.params.toAddress
        punkHistoryEntity.timestamp = event.block.timestamp

        // 初始交易，设置floorPrice和ceilingPrice为交易价格
        punkHistoryEntity.lastTradePrice = event.params.value
        punkHistoryEntity.totalValue = event.params.value
        punkHistoryEntity.floorPrice = event.params.value
        punkHistoryEntity.ceilingPrice = event.params.value

        punkHistoryEntity.save();
    } else {
        // 如果punkHistoryEntity已经存在，就对TransactionCounts加一，并保存
        punkHistoryEntity.totalTransactions = punkHistoryEntity.totalTransactions.plus(BigInt.fromI32(1))
        punkHistoryEntity.totalValue = punkHistoryEntity.totalValue.plus(event.params.value)

        // 判断最高最低价
        if (event.params.value.gt(punkHistoryEntity.ceilingPrice)) {
            punkHistoryEntity.ceilingPrice = event.params.value
        }
        if (event.params.value.lt(punkHistoryEntity.floorPrice)) {
            punkHistoryEntity.floorPrice = event.params.value
        }

        punkHistoryEntity.save()
    }

    // 设置用户信息
    let fromUser = getUserInfo(event.params.fromAddress)
    let toUser = getUserInfo(event.params.toAddress)

    // 更新fromUser
    fromUser.soldPunkCounts = fromUser.soldPunkCounts.plus(BigInt.fromI32(1))
    fromUser.userTransactionCount = fromUser.userTransactionCount.plus(BigInt.fromI32(1))
    fromUser.totalSpent = fromUser.totalSpent.plus(event.params.value)

    // 更新toUser
    toUser.boughtPunkCounts = toUser.boughtPunkCounts.plus(BigInt.fromI32(1))
    toUser.userTransactionCount = toUser.userTransactionCount.plus(BigInt.fromI32(1))
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

export function getUserInfo(address: Bytes): UserInfo {
    let user = UserInfo.load(address)

    if (!user) {
        user = new UserInfo(address)
        user.userTransactionCount = BigInt.fromI32(0)
        user.totalReceived = BigInt.fromI32(0)
        user.totalSpent = BigInt.fromI32(0)
        user.boughtPunkCounts = BigInt.fromI32(0)
        user.soldPunkCounts = BigInt.fromI32(0)
        user.punkHoldingCount = BigInt.fromI32(0)
        user.save()
    }

    return user as UserInfo
}
