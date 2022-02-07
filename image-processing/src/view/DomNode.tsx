import React from 'react';

interface Props {
  node: HTMLElement | undefined,
}

function DomNode({node}: Props) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (container) {
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
      if (node) {
        container.appendChild(node);
      }
    }
  }, [node, container])

  return <div ref={setContainer} />
}

export default DomNode;
