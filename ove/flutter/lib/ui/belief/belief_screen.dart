import 'package:flutter/material.dart';

class BeliefScreen extends StatelessWidget {
  final String sessionId;
  const BeliefScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}
