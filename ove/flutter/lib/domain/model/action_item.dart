enum ActionType { cognitive, behavioral }

class ActionItem {
  final String id;
  final String sessionId;
  final String text;
  final ActionType type;
  final DateTime createdAt;

  const ActionItem({
    required this.id,
    required this.sessionId,
    required this.text,
    required this.type,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'session_id': sessionId,
        'text': text,
        'type': type.name,
        'created_at': createdAt.toIso8601String(),
      };

  factory ActionItem.fromMap(Map<String, dynamic> map) => ActionItem(
        id: map['id'] as String,
        sessionId: map['session_id'] as String,
        text: map['text'] as String,
        type: ActionType.values.byName(map['type'] as String),
        createdAt: DateTime.parse(map['created_at'] as String),
      );
}
