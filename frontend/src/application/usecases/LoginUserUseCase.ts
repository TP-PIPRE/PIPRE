import type { IAuthRepository } from "../../domain/ports/IAuthRepository";
import type { User } from "../../domain/models/User";

export class LoginUserUseCase {
  private authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.authRepository.login(email, password);
  }
}
