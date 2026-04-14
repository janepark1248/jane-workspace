import 'package:flutter/material.dart';

class ReportScreen extends StatelessWidget {
  final String sessionId;
  const ReportScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}
