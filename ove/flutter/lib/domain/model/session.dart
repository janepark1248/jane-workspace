import 'package:ove/domain/model/restatement.dart';
import 'package:ove/domain/model/belief_selection.dart';
import 'package:ove/domain/model/action_item.dart';

enum SessionStatus { inProgress, completed, interrupted }

class LocalSession {
  final String id;
  final DateTime startedAt;
  final DateTime? completedAt;
  final SessionStatus status;
  final String transcript;
  final Restatement? restatement;
  final List<FollowUpQA> followUpQA;
  final BeliefSelection? beliefSelection;
  final List<ActionItem> actionItems;

  const LocalSession({
    required this.id,
    required this.startedAt,
    this.completedAt,
    required this.status,
    this.transcript = '',
    this.restatement,
    this.followUpQA = const [],
    this.beliefSelection,
    this.actionItems = const [],
  });

  LocalSession copyWith({
    String? transcript,
    Restatement? restatement,
    List<FollowUpQA>? followUpQA,
    BeliefSelection? beliefSelection,
    List<ActionItem>? actionItems,
    SessionStatus? status,
    DateTime? completedAt,
  }) =>
      LocalSession(
        id: id,
        startedAt: startedAt,
        completedAt: completedAt ?? this.completedAt,
        status: status ?? this.status,
        transcript: transcript ?? this.transcript,
        restatement: restatement ?? this.restatement,
        followUpQA: followUpQA ?? this.followUpQA,
        beliefSelection: beliefSelection ?? this.beliefSelection,
        actionItems: actionItems ?? this.actionItems,
      );
}

class FollowUpQA {
  final String targetElement; // 'situation' | 'thought' | 'emotion'
  final String question;
  final String answerTranscript;

  const FollowUpQA({
    required this.targetElement,
    required this.question,
    required this.answerTranscript,
  });
}
