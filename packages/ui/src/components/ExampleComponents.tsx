import React from 'react';
import { Button, Card, Input, Badge, Avatar, Select, Textarea } from '../index';

export function ExampleComponents() {
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">
        UI Components Showcase
      </h2>

      {/* Button Variants */}
      <Card title="Buttons" description="Different button styles and states">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      {/* Form Elements */}
      <Card title="Form Elements" description="Input fields and form controls">
        <div className="space-y-4">
          <Input placeholder="Enter your name..." />
          <Input type="email" placeholder="Enter your email..." />
          <Input type="password" placeholder="Enter your password..." />
          <Textarea placeholder="Enter your message..." rows={4} />
          <Select options={selectOptions} placeholder="Select an option" />
        </div>
      </Card>

      {/* Badges and Avatars */}
      <Card
        title="Badges and Avatars"
        description="Status indicators and user avatars"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar fallback="JD" size="sm" />
            <Avatar fallback="JD" size="md" />
            <Avatar fallback="JD" size="lg" />
            <Avatar fallback="JD" size="xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </div>
      </Card>

      {/* Interactive Demo */}
      <Card title="Interactive Demo" description="A complete form example">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="First name" />
            <Input placeholder="Last name" />
          </div>
          <Input type="email" placeholder="Email address" />
          <Select options={selectOptions} />
          <Textarea placeholder="Your message..." rows={3} />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant="success">Active</Badge>
              <Badge variant="secondary">Verified</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button variant="primary">Submit</Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
