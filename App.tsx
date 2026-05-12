import { Alert, Button, Form, Host, Section, Text } from '@expo/ui/swift-ui';
import { foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

const LONG_TITLE = 'A very long title that goes well past what would reasonably fit on one line so we can see how SwiftUI handles wrapping or truncation inside an alert'.slice(0, 200);

export default function App() {
  if (Platform.OS !== 'ios') {
    return (
      <Host style={{ flex: 1 }}>
        <Form>
          <Section title="iOS only">
            <Text>This repro tests the SwiftUI Alert from @expo/ui/swift-ui. Run on iOS.</Text>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <LastActionSection />
        <BasicFlow />
        <DestructiveFlow />
        <TitleOnly />
        <TwoAlertsOnSameScreen />
        <MissingTrigger />
        <RapidToggle />
        <LongTitle />
        <EmptyTitle />
        <ProgrammaticOpen />
        <StatusBarSection />
      </Form>
    </Host>
  );
}

let setLastActionRef: ((action: string) => void) | null = null;

function LastActionSection() {
  const [lastAction, setLastAction] = useState('None yet');
  setLastActionRef = setLastAction;
  return (
    <Section title="Last action">
      <Text modifiers={[foregroundStyle('secondaryLabel')]}>{lastAction}</Text>
    </Section>
  );
}

function recordAction(action: string) {
  setLastActionRef?.(action);
}

function BasicFlow() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="1. Basic flow (cancel + confirm)">
      <Alert
        title="Sign out?"
        isPresented={isPresented}
        onIsPresentedChange={(v) => {
          setIsPresented(v);
          if (!v) recordAction('Basic: dismissed via system');
        }}>
        <Alert.Trigger>
          <Button label="Sign out" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button
            label="Sign Out"
            onPress={() => {
              recordAction('Basic: confirmed');
              setIsPresented(false);
            }}
          />
          <Button label="Cancel" role="cancel" onPress={() => recordAction('Basic: cancelled')} />
        </Alert.Actions>
        <Alert.Message>
          <Text>You will need to sign in again to access your account.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function DestructiveFlow() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="2. Destructive role (red text)">
      <Alert
        title="Delete account?"
        isPresented={isPresented}
        onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Button label="Delete account" role="destructive" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button
            label="Delete"
            role="destructive"
            onPress={() => {
              recordAction('Destructive: deleted');
              setIsPresented(false);
            }}
          />
          <Button label="Cancel" role="cancel" onPress={() => recordAction('Destructive: cancelled')} />
        </Alert.Actions>
        <Alert.Message>
          <Text>This action cannot be undone. All your data will be removed.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function TitleOnly() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="3. Title-only (no Alert.Message slot)">
      <Alert title="Saved" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Button label="Show title-only" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button
            label="OK"
            onPress={() => {
              recordAction('Title-only: acknowledged');
              setIsPresented(false);
            }}
          />
        </Alert.Actions>
      </Alert>
    </Section>
  );
}

function TwoAlertsOnSameScreen() {
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  return (
    <Section title="4. Two alerts on same screen (independent state)">
      <Alert title="Alert A" isPresented={showA} onIsPresentedChange={setShowA}>
        <Alert.Trigger>
          <Button label="Show A" onPress={() => setShowA(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button label="OK" onPress={() => { recordAction('A acknowledged'); setShowA(false); }} />
        </Alert.Actions>
        <Alert.Message>
          <Text>I am alert A. B should be independent.</Text>
        </Alert.Message>
      </Alert>
      <Alert title="Alert B" isPresented={showB} onIsPresentedChange={setShowB}>
        <Alert.Trigger>
          <Button label="Show B" onPress={() => setShowB(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button label="OK" onPress={() => { recordAction('B acknowledged'); setShowB(false); }} />
        </Alert.Actions>
        <Alert.Message>
          <Text>I am alert B. A should be independent.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function MissingTrigger() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="5. Missing Alert.Trigger child (should log.warn)">
      <Text modifiers={[foregroundStyle('secondaryLabel')]}>
        No trigger slot. Open programmatically with the button below. Check Xcode console for the warn line.
      </Text>
      <Button label="Open without trigger" onPress={() => setIsPresented(true)} />
      <Alert title="No trigger" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Actions>
          <Button
            label="OK"
            onPress={() => {
              recordAction('Missing trigger: acknowledged');
              setIsPresented(false);
            }}
          />
        </Alert.Actions>
      </Alert>
    </Section>
  );
}

function RapidToggle() {
  const [isPresented, setIsPresented] = useState(false);
  const [stressCount, setStressCount] = useState(0);
  const rapidFire = useCallback(() => {
    setStressCount((n) => n + 1);
    let count = 0;
    const interval = setInterval(() => {
      setIsPresented((p) => !p);
      count += 1;
      if (count >= 6) {
        clearInterval(interval);
        setIsPresented(true);
        recordAction(`Rapid toggle: ${count} flips, ended showing`);
      }
    }, 60);
  }, []);
  return (
    <Section title="6. Rapid toggle stress (true↔false at 60ms)">
      <Text modifiers={[foregroundStyle('secondaryLabel')]}>
        Stress runs: {stressCount}. Should never produce double-fire or stuck state.
      </Text>
      <Button label="Run rapid toggle" onPress={rapidFire} />
      <Alert title="Stress" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Button label="Manual open" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button
            label="OK"
            onPress={() => {
              recordAction(`Rapid toggle: acknowledged`);
              setIsPresented(false);
            }}
          />
        </Alert.Actions>
        <Alert.Message>
          <Text>If you can see this, the alert survived the flip storm.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function LongTitle() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="7. Long title (~200 chars)">
      <Alert title={LONG_TITLE} isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Button label="Show long-title alert" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button label="OK" onPress={() => { recordAction('Long title: acknowledged'); setIsPresented(false); }} />
        </Alert.Actions>
        <Alert.Message>
          <Text>Title should wrap or truncate cleanly without breaking the layout.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function EmptyTitle() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="8. Empty title">
      <Alert title="" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Button label="Show empty-title alert" onPress={() => setIsPresented(true)} />
        </Alert.Trigger>
        <Alert.Actions>
          <Button label="OK" onPress={() => { recordAction('Empty title: acknowledged'); setIsPresented(false); }} />
        </Alert.Actions>
        <Alert.Message>
          <Text>An empty title should still render an alert with the message below.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function ProgrammaticOpen() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <Section title="9. Programmatic open / close (no trigger interaction)">
      <Button label="Open in 1s" onPress={() => setTimeout(() => setIsPresented(true), 1000)} />
      <Button label="Force close" onPress={() => setIsPresented(false)} />
      <Alert title="Programmatic" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
        <Alert.Trigger>
          <Text modifiers={[foregroundStyle('tertiaryLabel')]}>(unused trigger slot)</Text>
        </Alert.Trigger>
        <Alert.Actions>
          <Button
            label="OK"
            onPress={() => {
              recordAction('Programmatic: acknowledged');
              setIsPresented(false);
            }}
          />
        </Alert.Actions>
        <Alert.Message>
          <Text>Driven entirely by external state without tapping a trigger.</Text>
        </Alert.Message>
      </Alert>
    </Section>
  );
}

function StatusBarSection() {
  return (
    <Section title="Status bar">
      <StatusBar style="auto" />
      <Text modifiers={[foregroundStyle('secondaryLabel')]}>
        Toggle Dark Mode in the simulator (Cmd+Shift+A) to confirm alert chrome reacts. Rotate (Cmd+Right Arrow) to test landscape. Settings → Accessibility → Display & Text Size to test Dynamic Type.
      </Text>
    </Section>
  );
}
