import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ove/ui/restatement/restatement_provider.dart';

class RestatementScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const RestatementScreen({super.key, required this.sessionId});

  @override
  ConsumerState<RestatementScreen> createState() => _RestatementScreenState();
}

class _RestatementScreenState extends ConsumerState<RestatementScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        ref.read(restatementProvider(widget.sessionId).notifier).loadAndRestate());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(restatementProvider(widget.sessionId));

    ref.listen(restatementProvider(widget.sessionId), (_, next) {
      if (next.readyForBelief) {
        context.pushReplacement('/belief/${widget.sessionId}');
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('지금 이런 상황이시군요')),
      body: SafeArea(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : _buildContent(context, state),
      ),
    );
  }

  Widget _buildContent(BuildContext context, RestatementState state) {
    final r = state.restatement;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (r != null) ...[
            _buildChip('상황', r.situation),
            const SizedBox(height: 12),
            _buildChip('생각', r.thought),
            const SizedBox(height: 12),
            _buildChip('감정', r.emotion),
          ],
          const Spacer(),
          if (state.followUpQuestion != null)
            _buildFollowUp(context, state.followUpQuestion!),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(width: 12),
            Expanded(
                child: Text(value.isEmpty ? '—' : value,
                    style: const TextStyle(fontSize: 15))),
          ],
        ),
      );

  Widget _buildFollowUp(BuildContext context, String question) => Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF252525),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(question, style: const TextStyle(fontSize: 15)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => _recordFollowUpAnswer(context),
            child: const Text('답하기'),
          ),
        ],
      );

  Future<void> _recordFollowUpAnswer(BuildContext context) async {
    final controller = TextEditingController();
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: '어떠셨나요?',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: const Text('확인'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
    if (result != null && result.isNotEmpty) {
      await ref
          .read(restatementProvider(widget.sessionId).notifier)
          .answerFollowUp(result);
    }
  }
}
