// User 관련 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  provider_id: string;
}

export interface UserCreateDto {
  name: string;
  email: string;
  providerId: string;
  provider?: string;
}

export interface UserUpdateDto {
  name?: string;
  email?: string;
}

