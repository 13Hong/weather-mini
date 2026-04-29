<template>
  <view class="page">
    <view class="city-list">
      <view
        v-for="city in cityList"
        :key="city.adcode"
        class="city-item"
        @tap="selectCity(city)"
      >
        <text class="city-name">{{ city.name }}</text>
        <view v-if="currentCity?.adcode === city.adcode" class="check-icon">✓</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { cityList } from "../../data/cities";
import { getCachedCity, setCachedCity } from "../../utils/storage";
import type { City } from "../../types/weather";

const currentCity = ref<City | null>(null);

function selectCity(city: City) {
  setCachedCity(city);
  uni.navigateBack();
}

onMounted(() => {
  currentCity.value = getCachedCity();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 32rpx;
}

.city-list {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.city-item:last-child {
  border-bottom: none;
}

.city-name {
  font-size: 34rpx;
  color: #1f2937;
}

.check-icon {
  color: #3b82f6;
  font-size: 36rpx;
}
</style>
