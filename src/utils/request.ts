interface RequestOptions {
  url: string
  method?: "GET" | "POST"
  data?: Record<string, unknown>
}

interface RequestResult<T> {
  success: boolean
  data: T | null
  error: string | null
}

export function request<T>(options: RequestOptions): Promise<RequestResult<T>> {
  return new Promise((resolve) => {
    uni.request({
      url: options.url,
      method: options.method || "GET",
      data: options.data,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve({
            success: true,
            data: res.data as T,
            error: null,
          });
        } else {
          resolve({
            success: false,
            data: null,
            error: `请求失败: ${res.statusCode}`,
          });
        }
      },
      fail: (err) => {
        resolve({
          success: false,
          data: null,
          error: err.errMsg || "网络请求失败",
        });
      },
    });
  });
}
