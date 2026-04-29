<template>
  <view class="page">
    <!-- Loading 状态 -->
    <view v-if="loading" class="status-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Error 状态 -->
    <view v-else-if="error" class="status-container">
      <view class="error-box">
        <text class="error-msg">{{ error }}</text>
        <button class="retry-btn" @tap="loadWeather">重试</button>
      </view>
    </view>

    <!-- Empty 状态 -->
    <view v-else-if="!currentCity" class="status-container">
      <text class="empty-text">暂无城市数据</text>
    </view>

    <!-- 天气内容 -->
    <view v-else class="content">
      <!-- 头部：城市名 + 下拉箭头 -->
      <view class="header" @tap="goToCity">
        <text class="city-name">{{ currentCity.name }}</text>
        <text class="arrow">▼</text>
      </view>

      <!-- 当前温度 -->
      <view class="current-temp">
        <text class="temp-number">{{ liveWeather?.temperature || '--' }}</text>
        <text class="temp-unit">°</text>
      </view>
      <view class="current-weather">{{ liveWeather?.weather || '暂无数据' }}</view>

      <!-- 实时天气详情 -->
      <view class="detail-row">
        <view class="detail-item">
          <text class="detail-label">风向</text>
          <text class="detail-value">{{ liveWeather?.winddirection || '--' }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">风力</text>
          <text class="detail-value">{{ liveWeather?.windpower || '--' }}级</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">湿度</text>
          <text class="detail-value">{{ liveWeather?.humidity || '--' }}%</text>
        </view>
      </view>

      <!-- 分割线 -->
      <view class="divider"></view>

      <!-- 未来预报 -->
      <view class="forecast-section">
        <view class="section-title-wrap">
          <text class="section-title">未来预报</text>
        </view>

        <!-- 外层包装：包含 canvas 和卡片列表 -->
        <view class="forecast-wrapper">
          <!-- 折线图：绝对定位在 line-area 区域 -->
          <canvas canvas-id="tempChart" id="tempChart" class="chart-canvas"></canvas>

          <!-- 卡片列表 -->
          <view class="forecast-list">
            <view
              v-for="i in 5"
              :key="i"
              class="forecast-item"
            >
              <!-- top-block：星期、日期、白天天气 -->
              <view class="top-block">
                <text class="forecast-week">{{ forecastList[i - 1]?.week || '--' }}</text>
                <text class="forecast-date">{{ forecastList[i - 1] ? formatDate(forecastList[i - 1].date) : '--' }}</text>
                <text class="forecast-icon">{{ forecastList[i - 1] ? getWeatherIcon(forecastList[i - 1].weather) : '-' }}</text>
                <text class="forecast-weather">{{ forecastList[i - 1]?.weather || '--' }}</text>
              </view>

              <!-- line-area：折线图专属区域（固定高度） -->
              <view class="line-area"></view>

              <!-- bottom-block：晚上天气、风向风力 -->
              <view class="bottom-block">
                <text class="forecast-icon-night">{{ forecastList[i - 1] ? getWeatherIcon(forecastList[i - 1].nightWeather) : '-' }}</text>
                <text class="forecast-weather-night">{{ forecastList[i - 1]?.nightWeather || '--' }}</text>
                <text class="forecast-wind">{{ forecastList[i - 1]?.dayWind || '--' }}风</text>
                <text class="forecast-power">{{ forecastList[i - 1]?.dayPower || '--' }}级</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCachedCity, setCachedCity } from "../../utils/storage";
import { getLiveWeather, getForecast } from "../../apis/weather";
import type { City, LiveWeather, ForecastWeather } from "../../types/weather";

const loading = ref(true);
const error = ref<string | null>(null);
const currentCity = ref<City | null>(null);
const liveWeather = ref<LiveWeather | null>(null);
const forecastList = ref<ForecastWeather[]>([]);

let isLoading = false;

async function loadWeather() {
  if (isLoading) return;
  isLoading = true;
  loading.value = true;
  error.value = null;

  let city = getCachedCity();
  if (!city) {
    city = { name: "北京", adcode: "110000" };
    setCachedCity(city);
  }

  currentCity.value = city;

  const [liveRes, forecastRes] = await Promise.all([
    getLiveWeather(city.adcode),
    getForecast(city.adcode),
  ]);

  loading.value = false;
  isLoading = false;

  if (!liveRes.success) {
    error.value = liveRes.error || "获取天气失败";
    return;
  }

  if (!forecastRes.success) {
    error.value = forecastRes.error || "获取预报失败";
    return;
  }

  liveWeather.value = liveRes.data;
  forecastList.value = forecastRes.data || [];

  setTimeout(drawChart, 100);
}

function goToCity() {
  uni.navigateTo({ url: "/pages/city/city" });
}

function formatDate(dateStr: string): string {
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);
  return `${month}-${day}`;
}

function getWeatherIcon(weather: string): string {
  if (weather.includes('晴')) return '☀️';
  if (weather.includes('多云')) return '⛅';
  if (weather.includes('阴')) return '☁️';
  if (weather.includes('雨')) return '🌧️';
  if (weather.includes('雪')) return '❄️';
  if (weather.includes('雾')) return '🌫️';
  if (weather.includes('风')) return '💨';
  return '🌤️';
}

function drawChart() {
  if (forecastList.value.length === 0) return;

  const ctx = uni.createCanvasContext("tempChart");

  // 【修改点1】获取 canvas 节点的真实宽度（px）
  const query = uni.createSelectorQuery();
  query.select('#tempChart').boundingClientRect((rect: any) => {
    if (!rect) return;

    // 【修改点2】使用真实渲染宽度
    const width = rect.width;
    const height = rect.height;

    const temps = forecastList.value.map((item) => parseInt(item.dayTemp));
    const nightTemps = forecastList.value.map((item) => parseInt(item.nightTemp));
    const allTemps = [...temps, ...nightTemps];
    const maxTemp = Math.max(...allTemps) + 3;
    const minTemp = Math.min(...allTemps) - 3;

    // 【修改点3】根据实际 canvas 宽度计算 itemWidth
    const itemWidth = width / 5; // 5天数据
    const chartHeight = height * 0.6;  // 折线图高度范围
    const topPadding = height * 0.2;  // 顶部留白
    const bottomPadding = height * 0.2;  // 底部留白

    // 两条线分别基于不同的温度范围计算Y坐标
    function getDayY(temp: number) {
      // 白天温度：从顶部往下绘制
      const tempRange = maxTemp - minTemp;
      const normalizedTemp = (temp - minTemp) / tempRange;
      return topPadding + (1 - normalizedTemp) * chartHeight;
    }

    function getNightY(temp: number) {
      // 晚上温度：从底部往上绘制
      const tempRange = maxTemp - minTemp;
      const normalizedTemp = (temp - minTemp) / tempRange;
      return height - bottomPadding - normalizedTemp * chartHeight;
    }

    // 【修改点4】x坐标 = index * itemWidth + itemWidth / 2（每个卡片中心）- 偏移调整对齐
    function getX(index: number) {
      return index * itemWidth + itemWidth / 2 - 10;
    }

    ctx.clearRect(0, 0, width, height);

    // 画白天温度平滑折线
    ctx.setStrokeStyle("#ff6b6b");
    ctx.setLineWidth(2);
    ctx.beginPath();
    temps.forEach((temp, i) => {
      const x = getX(i);
      const y = getDayY(temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = getX(i - 1);
        const prevY = getDayY(temps[i - 1]);
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });
    ctx.stroke();

    // 白天温度圆点和文字（文字在圆点上方）
    ctx.setFillStyle("#ff6b6b");
    temps.forEach((temp, i) => {
      const x = getX(i);
      const y = getDayY(temp);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setFontSize(14);
      ctx.setFillStyle("#ff6b6b");
      ctx.fillText(`${temp}°`, x - 14, y - 12);
    });

    // 画晚上温度平滑折线
    ctx.setStrokeStyle("#4dabf7");
    ctx.setLineWidth(2);
    ctx.beginPath();
    nightTemps.forEach((temp, i) => {
      const x = getX(i);
      const y = getNightY(temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = getX(i - 1);
        const prevY = getNightY(nightTemps[i - 1]);
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });
    ctx.stroke();

    // 晚上温度圆点和文字（文字在圆点下方）
    ctx.setFillStyle("#4dabf7");
    nightTemps.forEach((temp, i) => {
      const x = getX(i);
      const y = getNightY(temp);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setFontSize(14);
      ctx.setFillStyle("#4dabf7");
      ctx.fillText(`${temp}°`, x - 14, y + 22);
    });

    ctx.draw();
  }).exec();
}

onMounted(() => {
  loadWeather();
});

onShow(() => {
  loadWeather();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 32rpx;
}

.status-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.loading-text {
  font-size: 32rpx;
  color: #999;
}

.error-box {
  background: #f5f5f5;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
}

.error-msg {
  color: #666;
  font-size: 28rpx;
  display: block;
  margin-bottom: 32rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.retry-btn {
  background: #3b82f6;
  color: #fff;
  padding: 16rpx 48rpx;
  border-radius: 100rpx;
  font-size: 28rpx;
}

.content {
  padding-top: 60rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.city-name {
  font-size: 40rpx;
  font-weight: 600;
  color: #000;
}

.arrow {
  font-size: 24rpx;
  color: #666;
  margin-left: 8rpx;
}

.current-temp {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 8rpx;
}

.temp-number {
  font-size: 160rpx;
  font-weight: 200;
  color: #000;
  line-height: 1;
}

.temp-unit {
  font-size: 60rpx;
  font-weight: 300;
  color: #000;
  margin-top: 20rpx;
}

.current-weather {
  text-align: center;
  font-size: 36rpx;
  color: #666;
  margin-bottom: 40rpx;
}

.detail-row {
  display: flex;
  justify-content: space-around;
  padding: 0 32rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.detail-value {
  font-size: 32rpx;
  color: #333;
}

.divider {
  height: 1rpx;
  background: #eee;
  margin: 40rpx 0;
}

.forecast-section {
  padding-bottom: 60rpx;
}

.section-title-wrap {
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #000;
}

/* 外层包装：相对定位，作为 canvas 和卡片列表的定位参考 */
.forecast-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  height: 300px;
}

/* canvas 绝对定位，覆盖 line-area 区域 */
.chart-canvas {
  position: absolute;
  top: 103px;
  left: 2px;
  width: 900rpx;
  height: 200rpx;
  z-index: 1;
}

/* 卡片列表：z-index 高于 canvas，让内容覆盖在折线图上方 */
.forecast-list {
  display: inline-flex;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

/* 每个预报卡片：拆成三个固定高度区域 */
.forecast-item {
  width: 150rpx;
  flex-shrink: 0;
  margin-right: 30rpx;
  display: flex;
  flex-direction: column;
}

/* top-block：固定高度，包含星期、日期、白天天气 */
.top-block {
  height: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* line-area：折线图专属区域，固定高度 */
.line-area {
  height: 250rpx;
}

/* bottom-block：固定高度，包含晚上天气、风向风力 */
.bottom-block {
  height: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.forecast-week {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.forecast-date {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.forecast-weather {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.forecast-icon {
  font-size: 48rpx;
  margin-bottom: 4rpx;
}

.forecast-temp-high {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff6b6b;
  margin-bottom: 4rpx;
}

.forecast-temp-low {
  font-size: 32rpx;
  font-weight: 600;
  color: #4dabf7;
  margin-bottom: 4rpx;
}

.forecast-icon-night {
  font-size: 48rpx;
  margin-bottom: 4rpx;
}

.forecast-weather-night {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.forecast-wind {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.forecast-power {
  font-size: 24rpx;
  color: #999;
}
</style>
