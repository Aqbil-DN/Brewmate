import 'package:flutter/material.dart';

class CoffeeMatchEntryScreen extends StatelessWidget {
  const CoffeeMatchEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coffee Match')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Find your perfect brew',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: () {}, child: const Text('Start Quiz')),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {},
              child: const Text('Chat with AI Barista'),
            ),
          ],
        ),
      ),
    );
  }
}
