enum SessionStep {
  idle,
  recording,
  transcribing,
  restating,
  followUp,
  beliefSelection,
  generating,
  report,
  complete;

  bool get isTerminal => this == complete;

  bool get isLoading =>
      this == transcribing || this == restating || this == generating;
}
