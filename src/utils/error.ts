interface AxiosLike {
  response?: { data?: { message?: string } }
  code?: string
  message?: string
}

export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as AxiosLike
  if (e?.response?.data?.message) return e.response.data.message
  if (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNREFUSED') {
    return 'Cannot reach the server. Make sure the API is running.'
  }
  return fallback
}
