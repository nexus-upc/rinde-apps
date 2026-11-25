package com.nexus.rinde.mobile.data.local

import kotlinx.coroutines.flow.Flow

/** Abstracción sobre el almacenamiento de la cola para pruebas sin Room. */
interface QueueStore {
    fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>>
    fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>>
    suspend fun countPending(userId: String): Int
    suspend fun findByTypeAndStatus(
        userId: String,
        type: QueueItemType,
        status: QueueItemStatus,
    ): List<QueueItemEntity>
    suspend fun findByKey(key: String): QueueItemEntity?
    suspend fun upsert(item: QueueItemEntity)
    suspend fun upsertAll(items: List<QueueItemEntity>)
    suspend fun deleteByKey(key: String)
    suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long)
}

class RoomQueueStore(
    private val dao: OfflineQueueDao,
) : QueueStore {
    override fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>> =
        dao.observePendingAndRejected(userId)

    override fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>> =
        dao.observeByTrip(userId, tripId)

    override suspend fun countPending(userId: String): Int = dao.countPending(userId)

    override suspend fun findByTypeAndStatus(
        userId: String,
        type: QueueItemType,
        status: QueueItemStatus,
    ): List<QueueItemEntity> = dao.findByTypeAndStatus(userId, type.name, status.name)

    override suspend fun findByKey(key: String): QueueItemEntity? = dao.findByKey(key)

    override suspend fun upsert(item: QueueItemEntity) = dao.upsert(item)

    override suspend fun upsertAll(items: List<QueueItemEntity>) = dao.upsertAll(items)

    override suspend fun deleteByKey(key: String) = dao.deleteByKey(key)

    override suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long) =
        dao.purgeOldSynced(userId, cutoffEpochMs)
}
