interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  return (
    <section className="panel modal-panel">
      <div className="row between">
        <h3>FlowDJ Keyboard Onboarding</h3>
        <button className="action-btn" onClick={onClose}>Start Mixing</button>
      </div>
      <p>FlowDJ is keyboard-first. Use number keys to switch modes and keep one hand on transport keys.</p>
      <p><span className="kbd">1/2/3/4</span> change modes. <span className="kbd">Tab</span> switches active deck.</p>
      <p>Recovery mode includes guarded actions. Hold recovery kill switch key to trigger.</p>
      <p>Press <span className="kbd">H</span> anytime to reopen help and <span className="kbd">G</span> for key mapping.</p>
    </section>
  );
}
