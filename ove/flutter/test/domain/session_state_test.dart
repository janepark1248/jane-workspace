import 'package:flutter_test/flutter_test.dart';
import 'package:ove/domain/session_state.dart';
import 'package:ove/domain/model/restatement.dart';

void main() {
  group('SessionStep', () {
    test('초기 상태는 idle', () {
      expect(SessionStep.idle.isTerminal, false);
    });

    test('complete는 terminal', () {
      expect(SessionStep.complete.isTerminal, true);
    });

    test('Restatement.isComplete — 세 요소 모두 있으면 true', () {
      final r = Restatement(
        situation: '발표가 망했다',
        thought: '나는 무능하다',
        emotion: '수치심',
      );
      expect(r.isComplete, true);
    });

    test('Restatement.isComplete — emotion 없으면 false', () {
      final r = Restatement(
        situation: '발표가 망했다',
        thought: '나는 무능하다',
        emotion: '',
      );
      expect(r.isComplete, false);
    });

    test('Restatement.missingElement — emotion 없으면 emotion 반환', () {
      final r = Restatement(
        situation: '발표',
        thought: '나는 무능',
        emotion: '',
      );
      expect(r.missingElement, 'emotion');
    });
  });
}
