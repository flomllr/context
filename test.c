/* Carbon includes everything necessary for Accessibilty API */
#include <Carbon/Carbon.h>

static bool amIAuthorized ()
{
    if (AXAPIEnabled() != 0) {
        /* Yehaa, all apps are authorized */
        return true;
    }
    /* Bummer, it's not activated, maybe we are trusted */
    if (AXIsProcessTrusted() != 0) {
        /* Good news, we are already trusted */
        return true;
    }
    /* Crap, we are not trusted...
     * correct behavior would now be to become a root process using
     * authorization services and then call AXMakeProcessTrusted() to make
     * ourselves trusted, then restart... I'll skip this here for
     * simplicity.
     */
    return false;
}


static AXUIElementRef getFrontMostApp ()
{
    pid_t pid;
    ProcessSerialNumber psn;

    GetFrontProcess(&psn);
    GetProcessPID(&psn, &pid);
    return AXUIElementCreateApplication(pid);
}


int main (
    int argc,
    char ** argv
) {
    int i;
    AXValueRef temp;
    CGSize windowSize;
    CGPoint windowPosition;
    CFStringRef windowTitle;
    AXUIElementRef frontMostApp;
    AXUIElementRef frontMostWindow;

    if (!amIAuthorized()) {
        printf("Can't use accessibility API!\n");
        return 1;
    }

    /* Give the user 5 seconds to switch to another window, otherwise
     * only the terminal window will be used
     */
    for (i = 0; i < 5; i++) {
        sleep(1);
        printf("%d", i + 1);
        if (i < 4) {
            printf("...");
            fflush(stdout);
        } else {
            printf("\n");
        }
    }

    /* Here we go. Find out which process is front-most */
    frontMostApp = getFrontMostApp();

    /* Get the front most window. We could also get an array of all windows
     * of this process and ask each window if it is front most, but that is
     * quite inefficient if we only need the front most window.
     */
    AXUIElementCopyAttributeValue(
        frontMostApp, kAXFocusedWindowAttribute, (CFTypeRef *)&frontMostWindow
    );

    /* Get the title of the window */
    AXUIElementCopyAttributeValue(
        frontMostWindow, kAXTitleAttribute, (CFTypeRef *)&windowTitle
    );

    /* Get the window size and position */
    AXUIElementCopyAttributeValue(
        frontMostWindow, kAXSizeAttribute, (CFTypeRef *)&temp
    );
    AXValueGetValue(temp, kAXValueCGSizeType, &windowSize);
    CFRelease(temp);

    AXUIElementCopyAttributeValue(
        frontMostWindow, kAXPositionAttribute, (CFTypeRef *)&temp
    );
    AXValueGetValue(temp, kAXValueCGPointType, &windowPosition);
    CFRelease(temp);

    /* Print everything */
    printf("\n");
    CFShow(windowTitle);
    printf(
        "Window is at (%f, %f) and has dimension of (%f, %f)\n",
        windowPosition.x,
        windowPosition.y,
        windowSize.width,
        windowSize.height
    );

    /* Move the window to the right by 25 pixels */
    windowPosition.x = 0;
    windowPosition.y = 25;
    windowSize.width = 300;
    windowSize.height = 300;
    temp = AXValueCreate(kAXValueCGPointType, &windowPosition);
    AXUIElementSetAttributeValue(frontMostWindow, kAXPositionAttribute, temp);
    CFRelease(temp);
    temp = AXValueCreate(kAXValueCGPointType, &windowSize);
    AXUIElementSetAttributeValue(frontMostWindow, kAXPositionAttribute, temp);
    CFRelease(temp);

    /* Clean up */
    CFRelease(frontMostWindow);
    CFRelease(frontMostApp);
    return 0;
}