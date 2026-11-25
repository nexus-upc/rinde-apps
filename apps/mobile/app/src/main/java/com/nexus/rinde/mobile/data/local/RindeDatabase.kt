package com.nexus.rinde.mobile.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Dao
interface OfflineQueueDao {
    @Query(
        "SELECT * FROM offline_queue_items WHERE ownerUserId = :userId " +
            "AND status != 'SYNCED' ORDER BY createdAtEpochMs DESC",
    )
    fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>>

    @Query(
        "SELECT * FROM offline_queue_items WHERE ownerUserId = :userId " +
            "AND tripId = :tripId ORDER BY createdAtEpochMs DESC",
    )
    fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>>

    @Query(
        "SELECT COUNT(*) FROM offline_queue_items WHERE ownerUserId = :userId " +
            "AND status IN ('PENDING', 'PHOTO_PENDING', 'REJECTED')",
    )
    suspend fun countPending(userId: String): Int

    @Query(
        "SELECT * FROM offline_queue_items WHERE ownerUserId = :userId " +
            "AND itemType = :itemType AND status = :status ORDER BY createdAtEpochMs ASC",
    )
    suspend fun findByTypeAndStatus(
        userId: String,
        itemType: String,
        status: String,
    ): List<QueueItemEntity>

    @Query("SELECT * FROM offline_queue_items WHERE idempotencyKey = :key LIMIT 1")
    suspend fun findByKey(key: String): QueueItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: QueueItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<QueueItemEntity>)

    @Query("DELETE FROM offline_queue_items WHERE idempotencyKey = :key")
    suspend fun deleteByKey(key: String)

    @Query(
        "DELETE FROM offline_queue_items WHERE ownerUserId = :userId " +
            "AND status = 'SYNCED' AND updatedAtEpochMs < :cutoffEpochMs",
    )
    suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long)
}

@Dao
interface CachedTripDao {
    @Query("SELECT * FROM cached_trips WHERE ownerUserId = :userId ORDER BY updatedAtEpochMs DESC")
    suspend fun findByUser(userId: String): List<CachedTripEntity>

    @Query("SELECT * FROM cached_trips WHERE ownerUserId = :userId AND tripId = :tripId LIMIT 1")
    suspend fun findOne(userId: String, tripId: String): CachedTripEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<CachedTripEntity>)

    @Query("DELETE FROM cached_trips WHERE ownerUserId = :userId")
    suspend fun deleteByUser(userId: String)
}

@Database(
    entities = [QueueItemEntity::class, CachedTripEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class RindeDatabase : RoomDatabase() {
    abstract fun offlineQueueDao(): OfflineQueueDao
    abstract fun cachedTripDao(): CachedTripDao
}
