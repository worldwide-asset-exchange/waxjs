export class ModalOpener {
  private modalElement: HTMLDivElement | null;
  private content: HTMLElement;

  public constructor(content: HTMLElement) {
    this.content = content;
    this.initModal();
  }

  public initModal() {
    // Create the modal container
    this.modalElement = document.createElement("div");
    this.modalElement.classList.add("modal-overlay");
    const closeIcon = this.content.querySelector(
      "#activation-requisition-close-icon"
    );

    // Apply styles to the modal
    this.modalElement.style.position = "fixed";
    this.modalElement.style.top = "0";
    this.modalElement.style.left = "0";
    this.modalElement.style.width = "100%";
    this.modalElement.style.height = "100%";
    this.modalElement.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    this.modalElement.style.display = "none";
    this.modalElement.style.display = "flex";
    this.modalElement.style.alignItems = "center";
    this.modalElement.style.justifyContent = "center";

    // Append the content container to the modal
    if (this.modalElement) {
      this.modalElement.appendChild(this.content);
    }

    // Insert the modal as the last child of the body
    if (this.modalElement) {
      document.body.insertAdjacentElement("beforeend", this.modalElement);
    }

    // Add event listener to close the modal when clicking on the overlay
    if (this.modalElement) {
      this.modalElement.addEventListener(
        "click",
        this.handleOverlayClick.bind(this)
      );
    }

    if (closeIcon) {
      closeIcon.addEventListener("click", () => {
        this.closeModal();
      });
    }

    return this;
  }

  private handleOverlayClick(event: MouseEvent): void {
    // Check if the click target is the modal overlay itself (not its children)
    if (event.target === this.modalElement) {
      this.closeModal();
    }
  }

  public openModal(): void {
    if (this.modalElement) {
      this.modalElement.style.display = "block";
    }
  }

  public closeModal(): void {
    if (this.modalElement) {
      this.modalElement.style.display = "none";
    }
  }

  public updateContent(newContent: HTMLElement): void {
    // Remove existing content
    if (this.modalElement && this.content) {
      this.modalElement.removeChild(this.content);
    }

    // Update content reference
    this.content = newContent;

    // Append the new content container to the modal
    if (this.modalElement) {
      this.modalElement.appendChild(this.content);
    }
  }
}
