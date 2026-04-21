import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ove/domain/model/action_item.dart';
import 'package:ove/ui/report/report_provider.dart';

class ReportScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const ReportScreen({super.key, required this.sessionId});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
        () => ref.read(reportProvider(widget.sessionId).notifier).loadReport());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportProvider(widget.sessionId));
    return Scaffold(
      appBar: AppBar(title: const Text('리포트')),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.session == null
              ? const Center(child: Text('세션을 찾을 수 없습니다'))
              : _buildReport(context, state),
    );
  }

  Widget _buildReport(BuildContext context, ReportState state) {
    final session = state.session!;
    final belief = session.beliefSelection;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        if (belief?.selectedChoice.isNotEmpty ?? false) ...[
          const Text('핵심 신념',
              style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(belief!.selectedChoice,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w500)),
          ),
          const SizedBox(height: 24),
        ],
        if (belief?.interpretation.isNotEmpty ?? false) ...[
          const Text('해석',
              style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(belief!.interpretation,
                style: const TextStyle(fontSize: 14, height: 1.6)),
          ),
          const SizedBox(height: 24),
        ],
        if (session.actionItems.isNotEmpty) ...[
          const Text('행동 제안',
              style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          ...session.actionItems.map((item) => _ActionCard(item: item)),
          const SizedBox(height: 24),
        ],
        if (session.restatement != null) ...[
          const Text('오늘 있었던 일',
              style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          _SummaryCard(
            situation: session.restatement!.situation,
            thought: session.restatement!.thought,
            emotion: session.restatement!.emotion,
          ),
          const SizedBox(height: 32),
        ],
        FilledButton(
          onPressed: () => context.go('/'),
          child: const Text('홈으로'),
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final ActionItem item;
  const _ActionCard({required this.item});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              item.type == ActionType.cognitive
                  ? Icons.lightbulb_outline
                  : Icons.directions_run,
              size: 16,
              color: Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
                child: Text(item.text,
                    style: const TextStyle(fontSize: 14, height: 1.5))),
          ],
        ),
      );
}

class _SummaryCard extends StatelessWidget {
  final String situation, thought, emotion;
  const _SummaryCard(
      {required this.situation, required this.thought, required this.emotion});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            _buildRow('상황', situation),
            const Divider(color: Colors.white10, height: 20),
            _buildRow('생각', thought),
            const Divider(color: Colors.white10, height: 20),
            _buildRow('감정', emotion),
          ],
        ),
      );

  Widget _buildRow(String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 40,
              child: Text(label,
                  style: const TextStyle(color: Colors.grey, fontSize: 12))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      );
}
