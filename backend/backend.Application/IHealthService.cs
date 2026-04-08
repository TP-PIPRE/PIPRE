namespace backend.Application;

public interface IHealthService { string GetStatus(); }

public class HealthService : IHealthService 
{
    public string GetStatus() => "Application Layer: Funcionando correctamente";
}