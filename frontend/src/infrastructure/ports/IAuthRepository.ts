import type { User } from "../../shared/types/User";

export interface IAuthRepository {
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }>;
}
