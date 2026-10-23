import type { IAuthRepository } from "../../infrastructure/ports/IAuthRepository";
import type { User } from "../../shared/types/User";

export class LoginUserUseCase {
  private authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(
    email: string,
    password: string,
  ): Promise<{ user: User }> {
    return this.authRepository.login(email, password);
  }
}
