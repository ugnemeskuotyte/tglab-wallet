import client from './client'
import type { RegisterPayload, LoginPayload, User } from '../types'

export async function register(payload: RegisterPayload): Promise<{ id: string; name: string }> {
  const { data } = await client.post('/register', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await client.post('/login', payload)
  return data
}
