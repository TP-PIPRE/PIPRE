import { Modal } from "./Modal";

export function AdditionalAdviceModal({ isOpen, onCancel, onConfirm }: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md" title="Consejo adicional">
      <div className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">¿Solicitar otro consejo?</h2>
        <p>Has utilizado las 8 ayudas disponibles sin penalización. A partir de ahora, solicitar consejos adicionales puede reducir la cantidad de estrellas que obtendrás al completar este reto.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn-premium" onClick={onConfirm}>Recibir consejo</button>
        </div>
      </div>
    </Modal>
  );
}
