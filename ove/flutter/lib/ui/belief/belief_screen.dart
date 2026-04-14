import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ove/ui/belief/belief_provider.dart';

class BeliefScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const BeliefScreen({super.key, required this.sessionId});

  @override
  ConsumerState<BeliefScreen> createState() => _BeliefScreenState();
}

class _BeliefScreenState extends ConsumerState<BeliefScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
        () => ref.read(beliefProvider(widget.sessionId).notifier).loadChoices());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(beliefProvider(widget.sessionId));

    ref.listen(beliefProvider(widget.sessionId), (_, next) {
      if (next.selected != null) {
        context.pushReplacement('/report/${widget.sessionId}');
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('이런 생각이 근본에 있을 수 있어요')),
      body: SafeArea(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : _buildContent(context, state),
      ),
    );
  }

  Widget _buildContent(BuildContext context, BeliefState state) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('가장 공감되는 것을 선택하세요',
                style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),
            ...state.choices.map((choice) => _ChoiceTile(
                  choice: choice,
                  onTap: () => ref
                      .read(beliefProvider(widget.sessionId).notifier)
                      .selectBelief(choice),
                )),
            const SizedBox(height: 12),
            _DirectInputTile(
              onSubmit: (text) => ref
                  .read(beliefProvider(widget.sessionId).notifier)
                  .submitCustom(text),
            ),
          ],
        ),
      );
}

class _ChoiceTile extends StatelessWidget {
  final String choice;
  final VoidCallback onTap;
  const _ChoiceTile({required this.choice, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white24),
          ),
          child: Row(
            children: [
              Expanded(
                  child: Text(choice, style: const TextStyle(fontSize: 15))),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            ],
          ),
        ),
      );
}

class _DirectInputTile extends StatelessWidget {
  final ValueChanged<String> onSubmit;
  const _DirectInputTile({required this.onSubmit});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () async {
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
                  const Text('직접 입력',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    decoration: const InputDecoration(
                      hintText: '나는 ...',
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
          if (result != null && result.isNotEmpty) onSubmit(result);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: const Row(
            children: [
              Icon(Icons.edit_outlined, size: 16, color: Colors.grey),
              SizedBox(width: 8),
              Text('직접 입력',
                  style: TextStyle(color: Colors.grey, fontSize: 14)),
            ],
          ),
        ),
      );
}
