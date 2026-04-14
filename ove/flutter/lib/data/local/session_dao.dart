import 'package:sqflite/sqflite.dart';
import 'package:ove/data/local/database_helper.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/domain/model/restatement.dart';
import 'package:ove/domain/model/belief_selection.dart';
import 'package:ove/domain/model/action_item.dart';

class SessionDao {
  final DatabaseHelper _helper;

  SessionDao(this._helper);

  Future<void> insertSession(LocalSession session) async {
    final db = await _helper.database;
    await db.insert(
      'sessions',
      _sessionToMap(session),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    for (final qa in session.followUpQA) {
      await db.insert('follow_up_qa', {
        'session_id': session.id,
        'target_element': qa.targetElement,
        'question': qa.question,
        'answer_transcript': qa.answerTranscript,
      });
    }
    for (final item in session.actionItems) {
      await db.insert('action_items', item.toMap());
    }
  }

  Future<List<LocalSession>> getAllSessions() async {
    final db = await _helper.database;
    final maps = await db.query('sessions', orderBy: 'started_at DESC');
    return Future.wait(maps.map(_mapToSession));
  }

  Future<LocalSession?> getSession(String id) async {
    final db = await _helper.database;
    final maps = await db.query('sessions', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return _mapToSession(maps.first);
  }

  Future<LocalSession> _mapToSession(Map<String, dynamic> map) async {
    final db = await _helper.database;
    final id = map['id'] as String;

    final qaList = await db.query('follow_up_qa',
        where: 'session_id = ?', whereArgs: [id]);
    final actionList = await db.query('action_items',
        where: 'session_id = ?', whereArgs: [id]);

    return LocalSession(
      id: id,
      startedAt: DateTime.parse(map['started_at'] as String),
      completedAt: map['completed_at'] != null
          ? DateTime.parse(map['completed_at'] as String)
          : null,
      status: SessionStatus.values.byName(map['status'] as String),
      transcript: map['transcript'] as String? ?? '',
      restatement: (map['situation'] != null)
          ? Restatement(
              situation: map['situation'] as String,
              thought: map['thought'] as String? ?? '',
              emotion: map['emotion'] as String? ?? '',
            )
          : null,
      followUpQA: qaList
          .map((q) => FollowUpQA(
                targetElement: q['target_element'] as String,
                question: q['question'] as String,
                answerTranscript: q['answer_transcript'] as String,
              ))
          .toList(),
      beliefSelection: (map['selected_choice'] != null)
          ? BeliefSelection(
              choices: (map['belief_choices'] as String? ?? '').split('|||'),
              selectedChoice: map['selected_choice'] as String,
              isCustomInput: (map['is_custom_input'] as int? ?? 0) == 1,
              interpretation: map['interpretation'] as String? ?? '',
            )
          : null,
      actionItems: actionList.map((a) => ActionItem.fromMap(a)).toList(),
    );
  }

  Map<String, dynamic> _sessionToMap(LocalSession s) => {
        'id': s.id,
        'started_at': s.startedAt.toIso8601String(),
        'completed_at': s.completedAt?.toIso8601String(),
        'status': s.status.name,
        'transcript': s.transcript,
        'situation': s.restatement?.situation,
        'thought': s.restatement?.thought,
        'emotion': s.restatement?.emotion,
        'belief_choices': s.beliefSelection?.choices.join('|||'),
        'selected_choice': s.beliefSelection?.selectedChoice,
        'is_custom_input': s.beliefSelection?.isCustomInput == true ? 1 : 0,
        'interpretation': s.beliefSelection?.interpretation,
      };
}
