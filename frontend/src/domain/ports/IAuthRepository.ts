import type { User } from "../models/User";

export interface IAuthRepository {
  login(email: string, password: string): Promise<User>;
}
