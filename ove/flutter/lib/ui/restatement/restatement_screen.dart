import 'package:flutter/material.dart';

class RestatementScreen extends StatelessWidget {
  final String sessionId;
  const RestatementScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}
