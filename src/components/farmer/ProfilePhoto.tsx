
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfilePhotoProps {
  profileImage: string;
  name: string;
}

const ProfilePhoto = ({ profileImage, name }: ProfilePhotoProps) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Avatar className="h-40 w-40 mb-4">
          <AvatarImage src={profileImage} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <Button variant="outline" className="w-full">Change Photo</Button>
      </CardContent>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Member Since</span>
            <p>April 2023</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Farmer ID</span>
            <p>FRM-2023-0458</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Products Listed</span>
            <p>12</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Successful Sales</span>
            <p>8</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePhoto;
