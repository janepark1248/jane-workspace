class Restatement {
  final String situation;
  final String thought;
  final String emotion;

  const Restatement({
    required this.situation,
    required this.thought,
    required this.emotion,
  });

  bool get isComplete =>
      situation.isNotEmpty && thought.isNotEmpty && emotion.isNotEmpty;

  /// 빠진 첫 번째 요소 반환. 모두 있으면 null.
  String? get missingElement {
    if (situation.isEmpty) return 'situation';
    if (thought.isEmpty) return 'thought';
    if (emotion.isEmpty) return 'emotion';
    return null;
  }

  Restatement copyWith({String? situation, String? thought, String? emotion}) =>
      Restatement(
        situation: situation ?? this.situation,
        thought: thought ?? this.thought,
        emotion: emotion ?? this.emotion,
      );

  Map<String, dynamic> toMap() => {
        'situation': situation,
        'thought': thought,
        'emotion': emotion,
      };

  factory Restatement.fromMap(Map<String, dynamic> map) => Restatement(
        situation: map['situation'] as String? ?? '',
        thought: map['thought'] as String? ?? '',
        emotion: map['emotion'] as String? ?? '',
      );
}
