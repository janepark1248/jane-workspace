class BeliefSelection {
  final List<String> choices;
  final String selectedChoice;
  final bool isCustomInput;
  final String interpretation;

  const BeliefSelection({
    required this.choices,
    required this.selectedChoice,
    this.isCustomInput = false,
    this.interpretation = '',
  });

  bool get isSelected => selectedChoice.isNotEmpty;

  Map<String, dynamic> toMap() => {
        'choices': choices.join('|||'),
        'selected_choice': selectedChoice,
        'is_custom_input': isCustomInput ? 1 : 0,
        'interpretation': interpretation,
      };

  factory BeliefSelection.fromMap(Map<String, dynamic> map) => BeliefSelection(
        choices: (map['choices'] as String? ?? '').split('|||'),
        selectedChoice: map['selected_choice'] as String? ?? '',
        isCustomInput: (map['is_custom_input'] as int? ?? 0) == 1,
        interpretation: map['interpretation'] as String? ?? '',
      );
}
