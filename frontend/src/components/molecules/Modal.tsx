import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The overlay, the dialog and its header. A click on the overlay closes the
 * modal, while a click inside it is stopped so it does not reach the overlay.
 */
export default function Modal({ title, onClose, children }: Readonly<ModalProps>) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <dialog className="modal" open onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        {children}
      </dialog>
    </div>
  );
}
