import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ove/ui/app_router.dart';
import 'package:ove/ui/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: OveApp()));
}

class OveApp extends StatelessWidget {
  const OveApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp.router(
        title: 'ove',
        theme: AppTheme.dark(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      );
}
