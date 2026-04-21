import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:ove/ui/home/home_provider.dart';
import 'package:ove/domain/model/session.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(recentSessionsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 48),
            _buildHeader(),
            const Spacer(),
            _buildStartButton(context),
            const SizedBox(height: 24),
            sessionsAsync.when(
              data: (sessions) => sessions.isEmpty
                  ? const SizedBox.shrink()
                  : _buildRecentSessions(sessions),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ove',
                style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 4)),
            SizedBox(height: 8),
            Text('지금 어떤 생각이 드나요?',
                style: TextStyle(color: Colors.grey, fontSize: 14)),
          ],
        ),
      );

  Widget _buildStartButton(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: FilledButton(
          onPressed: () {
            final sessionId = const Uuid().v4();
            context.push('/recording', extra: sessionId);
          },
          child: const Text('지금 말하기', style: TextStyle(fontSize: 16)),
        ),
      );

  Widget _buildRecentSessions(List<LocalSession> sessions) {
    final recent = sessions.take(3).toList();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('최근 세션',
              style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          ...recent.map((s) => _SessionTile(session: s)),
        ],
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  final LocalSession session;
  const _SessionTile({required this.session});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MM.dd HH:mm');
    final belief = session.beliefSelection?.selectedChoice ?? '';
    final title = belief.isNotEmpty
        ? belief
        : session.transcript.substring(
            0, session.transcript.length.clamp(0, 30));
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        title,
        style: const TextStyle(fontSize: 14),
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(fmt.format(session.startedAt),
          style: const TextStyle(color: Colors.grey, fontSize: 12)),
      onTap: () => context.push('/report/${session.id}'),
    );
  }
}
