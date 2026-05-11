interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  return (
    <section className="assistant-drawer">
      <div className="row between">
        <h3>Keyboard Flight Deck</h3>
        <button className="action-btn compact" onClick={onClose}>Dismiss</button>
      </div>
      <p className="tiny-text">Use one hand for transport, one for mode control. Keep the pointer optional.</p>
      <p><span className="kbd">1/2/3/4</span> mode select. <span className="kbd">Tab</span> active deck.</p>
      <p><span className="kbd">H</span> re-open this guide. <span className="kbd">G</span> key mapping panel.</p>
      <p className="tiny-text">Recovery actions are guarded. Hold the assigned key for kill-switch operations.</p>
    </section>
  );
}
