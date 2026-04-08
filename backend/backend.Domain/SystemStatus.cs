namespace backend.Domain;

public class SystemStatus
{
    public string Message { get; set; } = "El Dominio está vivo";
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}